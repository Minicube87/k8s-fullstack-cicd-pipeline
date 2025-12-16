pipeline {
    agent any
    
    environment {
        REGISTRY = 'nexus.skyered-devops.de/kurs3/jan'  // anpassen!!!!
        FRONTEND_IMAGE = "${REGISTRY}/todo-frontend"
        BACKEND_IMAGE = "${REGISTRY}/todo-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"  // Oder v1 oder latest
    }
    
    stages {
        stage('Checkout') {
            steps {
               checkout scm
            }
        }
        stage('Build') {
            steps {
              sh"""
                docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend
                docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ./backend
                """
            }
        }
        stage('Push') {
            steps {
              sh"""
                docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                """
            }
        }
       stage('Deploy') {
            steps {
               sh """
                kubectl apply -f k8s/frontend-deployment.yaml
                kubectl apply -f k8s/frontend-service.yaml
                kubectl apply -f k8s/backend-deployment.yaml
                kubectl apply -f k8s/backend-service.yaml
                """
            }
}
    }
}
