# Professional Architecture & Workflow Diagrams

This document provides a multi-layer visualization of the MenuSync platform, from high-level cloud infrastructure to low-level real-time data flows.

---

## 1. Cloud Infrastructure Layer (Physical)
*AWS Network topology and resource isolation.*

```mermaid
graph TD
    classDef nlb fill:#FF9900,stroke:#232F3E,color:white;
    classDef eks fill:#326CE5,stroke:#fff,color:white;
    classDef storage fill:#3B48CC,stroke:#fff,color:white;

    subgraph VPC [Custom VPC: 10.0.0.0/16]
        subgraph Public [Public Subnets - AZ 1a, 1b, 1c]
            NLB[AWS Network Load Balancer]:::nlb
            NAT[NAT Gateway - ap-south-1a]
            IGW[Internet Gateway]
        end
        
        subgraph Private [Private Subnets - Restricted]
            EKS[Amazon EKS Worker Nodes]:::eks
            DB_Disk[(EBS Volumes - GP3)]:::storage
        end
    end

    User((User)) -->|HTTPS| IGW
    IGW --> NLB
    NLB -->|Routing Port 443| EKS
    EKS -->|Egress Traffic| NAT
    NAT --> IGW
    EKS --- DB_Disk
```

---

## 2. Cluster Logical Layer (Kubernetes)
*Namespace isolation and workload orchestration.*

```mermaid
graph LR
    classDef ingress fill:#f9f,stroke:#333;
    classDef app fill:#bbf,stroke:#333;
    classDef security fill:#ffd,stroke:#333;

    subgraph Cluster [EKS Cluster: menusync-prod]
        subgraph Ingress_NS [Namespace: ingress-nginx]
            NIC[NGINX Ingress Controller]:::ingress
        end

        subgraph App_NS [Namespace: menusync-app]
            API[FastAPI Backend Pods]:::app
            MONGO[(MongoDB ReplicaSet)]
            REDIS[(Redis Master)]
        end

        subgraph Security_NS [Namespace: external-sec]
            ESO[External Secrets Operator]:::security
        end
    end

    NIC -->|Path Routing| API
    API -->|Persistence| MONGO
    API -->|Pub/Sub| REDIS
    ESO -.->|Injects Secrets| App_NS
```

---

## 3. Real-Time Data Flow (WebSockets)
*Sequence of events for a sub-5s menu update.*

```mermaid
sequenceDiagram
    participant Mgr as Manager Browser
    participant API as FastAPI Backend
    participant REDIS as Redis (Channel)
    participant CUST as Customer Browser

    Note over Mgr, CUST: Initial State: Item is Available
    Mgr->>API: PATCH /restaurants/1/ingredients (inStock: false)
    API->>API: Update MongoDB Document
    API->>REDIS: PUBLISH availability_updates {id: 1, stock: false}
    Note right of REDIS: Global Broadcast to all Pods
    REDIS-->>API: Received Update Message
    API-->>CUST: WebSocket Push: {type: UPDATE, restaurant: 1}
    Note left of CUST: UI updates instantly without refresh
```

---

## 4. Automation & GitOps Pipeline
*The software delivery lifecycle.*

```mermaid
graph LR
    Dev[Developer] -->|git push| AppRepo[App GitHub Repo]
    AppRepo -->|Webhook| J[Jenkins Master]
    
    subgraph Pipeline [Jenkins Pipeline]
        J -->|Unit Tests| UT[Pytest/Vitest]
        UT -->|Build| B[Docker Build]
        B -->|Security| S[ECR Scan]
    end

    S -->|Push| ECR[Amazon ECR]
    ECR -->|Update Tag| GOR[GitOps GitLab Repo]
    
    subgraph Continuous_Delivery [GitOps]
        GOR -->|Sync| Argo[ArgoCD Controller]
        Argo -->|Apply| EKS[EKS Cluster]
    end
```