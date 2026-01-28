pipeline{

    agent any
    
    options{
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
        gitLabConnection('GitLab-Public')

    }

    environment{

        COMPOSE_PROJECT_NAME = "menusync-${env.BUILD_ID}"

        SLACK_CH = 'C0A1WAPDNVD'   

        ECR_REPO = '685092162784.dkr.ecr.ap-south-1.amazonaws.com/menusync' 

        GIT_SSH = 'jenkins-ssh-gitlab'       
    }



    stages{

        stage('Git version fetch'){

            steps{
                script{
                    sh 'git fetch --tags'
                }
            }
        }

        stage('Version Calculation') {
            steps {
                script {
                    sh 'git fetch --tags'
                    
                    def latestTag = sh(script: 'git describe --tags --abbrev=0 || echo v1.0.0', returnStdout: true).trim()
                    
                    def commitCount = sh(script: "git rev-list --count ${latestTag}..HEAD || echo 0", returnStdout: true).trim()
                    
                    def baseVersion = latestTag.replace('v', '')
                    def parts = baseVersion.tokenize('.')
                    def major = parts[0]
                    def minor = parts[1]

                    env.APP_IMAGE_TAG = "${major}.${minor}.${commitCount}"
                    
                    env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    
                    echo "Calculated SemVer: ${env.APP_IMAGE_TAG} (Commits since ${latestTag}: ${commitCount})"
                }
            }
        }



        stage('Docker Build'){
            steps{
                    
                script{

                    env.APP_IMAGE_NAME = 'menusync-app'


                    sh "docker build --build-arg VERSION=${env.APP_IMAGE_TAG} --build-arg GIT_SHA=${env.GIT_SHA} -t $APP_IMAGE_NAME:$APP_IMAGE_TAG ."

                }
            }
        }

        stage('Unit tests'){
            steps{
                script{
                    sh 'docker run --rm $APP_IMAGE_NAME:$APP_IMAGE_TAG pytest app/tests_unit'
                }
            }
        }
        stage('integration tests'){

            steps{

                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]){
                
                    script{
                        
                        sh 'cp ${SECRET_FILE} .env'

                        sh 'docker compose up -d'

                        sh 'docker compose exec -T app python seed.py'

                        sh "docker compose --profile test up --abort-on-container-exit --exit-code-from tester"
                    }
                }
            }
        }

        stage('Docker Tag'){
            when{ branch 'main' }

            steps{
                script{
                    sh '''
                        aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 685092162784.dkr.ecr.ap-south-1.amazonaws.com
                        docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_REPO:$APP_IMAGE_TAG
                        docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_REPO:sha-$GIT_SHA
                    '''
                }
            }



        }
        stage('Docker Push'){
            when{ branch 'main' }
            steps{
                script{
                    sh 'docker push $ECR_REPO:$APP_IMAGE_TAG'
                }
            }
        }
        stage('Git Tag') {
            when{ branch 'main' }
            steps {
                script {


                    sshagent([GIT_SSH]){
                        sh """
                            git tag v${env.APP_IMAGE_TAG}
                            git push origin v${env.APP_IMAGE_TAG}
                        """
                    }   
                }
            }
        }
        //stage('Update ArgoCD repo'){}

    }

    post{
        always{
            script{

                sh 'docker compose down -v --remove-orphans'
                sh 'rm -f .env'
            }
        }
        success { 
            sendSlack('SUCCESS', '#1E90FF')

            updateGitlabCommitStatus name: 'build', state: 'success'
        }

        failure { 
        
            sendSlack('FAILURE', 'danger') 
        
            updateGitlabCommitStatus name: 'build', state: 'failure'
        }
    }

}










// Send Slack Notification
def sendSlack(status, color) {
    slackSend(color: color, message: "${status}: ${env.JOB_NAME} #${env.BUILD_NUMBER} | ${env.BUILD_URL}", channel: env.SLACK_CH)
}