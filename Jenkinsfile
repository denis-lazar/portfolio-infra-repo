pipeline{

    agent any
    
    options{
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()

    }

    environment{

        COMPOSE_PROJECT_NAME = "menusync-${env.BUILD_ID}"

        SLACK_CH = 'C0A1WAPDNVD'           
    }



    stages{

        //stage('Git version fetch'){}
        stage('Docker Build'){
            steps{
                script{
                    def env.APP_IMAGE_NAME = 'menusync-app'
                    def env.APP_IMAGE_TAG = '1.0'
                    sh 'docker build -t ${env.APP_IMAGE_NAME}:${env.APP_IMAGE_TAG} . '
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

        //stage('Docker Tag'){}
        //stage('Docker Push'){}
        //stage('Git Tag'){}
        //stage('Update ArgoCD repo'){}

    }

    post{
        always{
            script{

                sh 'docker compose down -v --remove-orphans'
                sh 'rm -f .env'
            }
        }
        success { sendSlack('SUCCESS', '#1E90FF') }
        failure { sendSlack('FAILURE', 'danger') }
    }

}










// Send Slack Notification
def sendSlack(status, color) {
    slackSend(color: color, message: "${status}: ${env.JOB_NAME} #${env.BUILD_NUMBER} | ${env.BUILD_URL}", channel: env.SLACK_CH)
}