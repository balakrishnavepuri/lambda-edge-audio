![AWS CloudFormation Stack](https://miro.medium.com/max/2962/1*VXRQhN_1xsu8sr6Uc1iZIA.png)

CloudFormation stack to manipulate audio files with lambda@edge

More information on [Medium](https://medium.com/@stephanecouzinier/how-to-deploy-a-lambda-edge-function-with-cloudformation-80637092e5a2)

# reference
* https://docs.aws.amazon.com/lambda/latest/dg/build-pipeline.html
* https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html

# Install

* Create a CloudFormation stack with the template cloudformation.yml the stack must be create in us-east-1 region.
* Sync this repository  with yur CodeCommit repository create by CloudFormation
* during build phase, a configuration file "config.json" will be create. it will contains the name of the data bucket.  
* Push your change to your repository. 
The PipeLine should generate a new version of your lambda function and update CloudFront with the correct Lambda Version.
* Try to open the link https://CLOUDFRONT-domain/1-2-1
CLOUDFRONT-domain is the domain name of the CloudFront distribution create by CloudFormation.

If everything works fine, you should hear some animals sound 

# todo
* documentation
* unit test
* eslint
* codecommit init from zip file 
