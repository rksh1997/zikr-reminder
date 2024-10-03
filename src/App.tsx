import React, { useState } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";
import notifications from "./notifications";

const NotificationButton = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const init = async () => {
    let isGranted = await isPermissionGranted();
    if (!isGranted) {
      const permission = await requestPermission();
      setPermissionGranted(permission === "granted");
    } else {
      setPermissionGranted(isGranted);
    }
  };

  const showNotification = () => {
    sendNotification({
      title: "اذكر الله",
      body: notifications[Math.floor(Math.random() * notifications.length)],
    });
  };

  React.useEffect(() => {
    if (!permissionGranted) {
      init();
    } else {
      const t = setInterval(() => {
        showNotification();
      }, 5 * 60 * 1000);

      return () => clearInterval(t);
    }
  }, [permissionGranted]);

  return null;
};

export default NotificationButton;
