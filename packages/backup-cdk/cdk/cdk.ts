import * as cdk from "@aws-cdk/core";
import BackupStack from "./BackupStack";

const HOSTED_ZONE = {
  zoneName: "mattb.tech",
  hostedZoneId: "Z2GPSB1CDK86DH",
};

const app = new cdk.App();

new BackupStack(app, "MattbTechBackup", {
  hostedZone: HOSTED_ZONE,
  liveDomainName: "mattb.tech",
  backupDomainName: "backup.mattb.tech",
});

new BackupStack(app, "LonesomeBackup", {
  hostedZone: HOSTED_ZONE,
  liveDomainName: "lonesome.mattb.tech",
  backupDomainName: "backup.lonesome.mattb.tech",
  disable: true,
});
