# Vibranium Wars!

## Pre-requisites
- aws-cli
- nvm
- node & npm (via nvm)
- serverless (via npm)
- jest (via npm for test)
- java (for test)

## Build
vwars is a node.js project, and can be built using npm. 
Build script will first prepare reduced size, lambda ready packages. Then will do a full npm install.
- `npm run build`

## Deployment
vwars can be deployed via serverless framework and aws-cli
1. Use aws-cli to configure and provide AWS credentials
    - `aws configure`
2. Configure one or more environment variable json files for each desired deployment environment. Copy env.template.json as an template, or use the provided env.local.json if testing against a local dynamodb
3. Deploy lambdas and supporting infrastructure with serverless. Use the `stage` option to specify which configured environment to deploy to. If none is provided, "local" stage is assumed.
    - `serverless deploy --stage dev`

## Test
vwars can be tested locally using serverless framework
1. Install plugins and local dynamodb for integration testing
    - `serverless plugin install -n serverless-dynamodb-local`
    - `serverless plugin install -n serverless-offline`
    - `serverless dynamodb install`
    - `npm install --save-dev jest`
    - `npm install --save serverless-dynamodb-local`
2. Start serverless in offline mode to run integration tests against local dynamodb
    - `serverless offline start`
3. Run unit/integration jest tests
    - `npm test`
4. Invoke individual functions locally as needed
    - `serverless invoke local --function vwars`

---
## Contributors
Creator and developer: @General Ronimus

Game design: @PlayBoyPk
