'use strict';
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const FfmpegCommand = require('fluent-ffmpeg');
const randomstring = require('randomstring');
const fs = require('fs-extra')
const url = require('url');
const config = require('./config');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
  region: 'us-east-1',
});
const BUCKET = config.audioBucket;

function getFile(key, destination) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destination)
      .on('error', (err) => {
        reject(err);
      })
      .on('close', () => {
        resolve(destination);
      });

    const s3Stream = S3.getObject({Bucket: BUCKET, Key: key})
      .createReadStream()
      .on('error', (err) => {
        reject(err);
      })
      .pipe(fileStream);
  });
}

function saveFile(data, audioPath) {
  return S3.putObject({
    Body: data,
    Bucket: BUCKET,
    ContentType: 'audio/mpeg',
    CacheControl: 'max-age=2592000',
    Key: audioPath,
    Tagging: 'source=transformer',
  }).promise();
}

exports.handler = (event, context, callback) => {
  const response = event.Records[0].cf.response;
  if (response.status !== '404' && response.status !== '403') {
    callback(null, response);
    return;
  }

  const tmpFolder = '/tmp/audio/' + randomstring.generate(10);
  const finalAudioFile = tmpFolder + '/final.mp3';
  fs.ensureDirSync(tmpFolder);
  FfmpegCommand.setFfmpegPath(ffmpegStatic.path);
  FfmpegCommand.setFfprobePath(ffprobeStatic.path);
  const command = new FfmpegCommand();
  const requestAudio = url.parse(event.Records[0].cf.request.uri);
  const audioPath = requestAudio.pathname.slice(1);
  const audioFiles = audioPath.split('-');
  const audioPromises = [];
  audioFiles.forEach((audioFile, key) => {
    audioPromises.push(getFile('assets/' + audioFile + '.mp3', tmpFolder + '/' + key + '.mp3'));
  });
  Promise.all(audioPromises).then((audioItems) => {
    audioItems.forEach((audioFile) => {
      command.input(audioFile);
    });
    command
      .audioBitrate(48)
      .audioFrequency(16000)
      .on('error', (err) => {
        console.error('An error occurred: ' + err.message);
        fs.removeSync(tmpFolder);
        response.status = '500';
        callback(null, response);
      })
      .on('end', () => {
        // join done save and return audio file
        const buffer = fs.readFileSync(finalAudioFile);
        fs.removeSync(tmpFolder);
        saveFile(buffer, audioPath).then((data) => {
          response.status = '200';
          response.statusDescription = 'OK';
          response.body = buffer.toString('base64');
          response.bodyEncoding = 'base64';
          response.headers['content-type'] = [{key: 'Content-Type', value: 'audio/mpeg'}];
          response.headers['content-length'] = [{key: 'Content-Length', value: String(buffer.length)}];
          callback(null, response);
        }, (err) => {
          console.error(err);
          response.status = '500';
          callback(null, response);
        });
      })
      .mergeToFile(finalAudioFile);
  }).catch((err) => {
    response.status = '500';
    callback(null, response);
  });
};
