# MongoDB ReplicaSet Fix Guide

This document outlines the troubleshooting steps and fixes applied to resolve the MongoDB `CrashLoopBackOff` and Authentication issues in the MenuSync platform.

## 1. Problem Description
The MongoDB pods (`menusync-app-mongodb-0`, `1`, and `arbiter-0`) were stuck in a restart loop, and the application was failing to authenticate with the database (Error Code 18).

## 2. Root Causes & Detailed Fixes

### A. Permission & Initialization Errors
**Issue:** Bitnami images use `sed` to modify config files at runtime. The security context was set to `readOnlyRootFilesystem: true`, which blocked these scripts. Additionally, fresh EBS volumes were owned by `root`, preventing the `1001` user from writing data.
**Fix:** 
- Disabled `readOnlyRootFilesystem`.
- Enabled `volumePermissions` init container to `chown` the volume.
- Set `podSecurityContext.fsGroup: 1001` to ensure the container user has permanent access to the persistent storage.

### B. Arbiter Host Resolution Failure
**Issue:** The MongoDB Arbiter node was attempting to discover the cluster using an incorrect DNS name (`...mongodb-arbiter-headless...` instead of `...mongodb-headless...`). This caused it to fail its "Scratch Deployment" phase because it couldn't find its peers.
**Fix:** Set `mongodb.initialPrimaryHost` globally in `values.yaml` to point explicitly to the Primary node's stable internal DNS:
`menusync-app-mongodb-0.menusync-app-mongodb-headless.menusync-app.svc.cluster.local`.

### C. Authentication Source Mismatch
**Issue:** The FastAPI application used `authSource=admin` by default. However, since the user `menusync_user` was created for the `menusync_db` database, MongoDB expected the authentication request to be directed at `menusync_db`.
**Fix:** Updated `MONGODB_AUTH_SOURCE` to `menusync_db` in the application environment variables.

### D. Race Conditions during Bootstrapping
**Issue:** `podManagementPolicy: Parallel` caused all MongoDB nodes to start at once. On a fresh deployment, Pod 1 would try to connect to Pod 0 before Pod 0 had even initialized the database, leading to connection timeouts and crash loops.
**Fix:** Changed to `podManagementPolicy: OrderedReady`. This forces Kubernetes to wait for Pod 0 to be fully healthy before starting Pod 1 and the Arbiter.

### E. Application Resource Exhaustion
**Issue:** The application's `100Mi` memory limit was insufficient for the heavy startup phase where it performs automatic database seeding (inserting multiple restaurants and menu items).
**Fix:** Increased application memory limits to `256Mi`.

---

## 3. The "Fresh Start" Checklist (Forever Fix)

If you perform a `terraform destroy` and want a perfect `terraform apply` from scratch, follow these steps:

1.  **Update AWS Secrets Manager:**
    Ensure the secret `production/menusync/mongo` contains a strong, 32-character Base64 string for `mongodb-replicaset-key`.
    *Example Key:* `1RxeF81MootRX2BQofczRtLvdEEV0pa5evEOBeQjnuk=`
2.  **Maintain GitOps Configuration:**
    The following settings in `GITOPS/apps-config/menusync/values.yaml` are **CRITICAL**:
    - `podManagementPolicy: OrderedReady`
    - `fsGroup: 1001`
    - `MONGODB_AUTH_SOURCE: menusync_db`
    - `initialPrimaryHost` set to the headless service of the primary node.
3.  **Build New Application Image:**
    The code fixes for images and database connection logic must be baked into a new image (e.g., `1.0.16`) and pushed to ECR. Update the `tag` in `values.yaml` accordingly.

---

## 4. Settings you can safely remove (Cleanup)
- `extraEnvVars` for Arbiter: Now handled by global `initialPrimaryHost`.
- `MONGODB_REPLICA_SET_NAME` in App: The driver auto-detects this; keeping it is optional but not required.

---

## 5. Manual Recovery Commands
If the cluster ever needs a manual "kickstart":

**Force add the arbiter:**
```bash
kubectl exec menusync-app-mongodb-0 -n menusync-app -- mongosh admin -u root -p <ROOT_PASSWORD> --eval "rs.addArb('menusync-app-mongodb-arbiter-0.menusync-app-mongodb-arbiter-headless.menusync-app.svc.cluster.local:27017')"
```

**Nuclear Reset (Last Resort):**
```bash
kubectl delete statefulset,pvc,configmap -l app.kubernetes.io/name=mongodb -n menusync-app
```