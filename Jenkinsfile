pipeline{

    agent any
    
    options{
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment{
        SLACK_CH = 'C0A1WAPDNVD'           
    }



    stages{
        stage('Docker Build'){
            steps{
                script{
                    sh 'docker compose build --no-cache'
                }
            }
        }
        stage('integration tests'){
            steps{
                script{
                    sh 'docker compose --profile test up --abort-on-container-exit --exit-code-from tester'
                }
            }
        }
    }

    post{
        always{
            script{
                sh 'docker compose down --v'
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