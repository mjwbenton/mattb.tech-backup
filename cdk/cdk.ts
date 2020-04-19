import * as cdk from "@aws-cdk/core";
import BackupStack from "./BackupStack";

const app = new cdk.App();
new BackupStack(app, "MattbTechBackup");
