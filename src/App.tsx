import React, { useState } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";
import { listen } from "@tauri-apps/api/event";
import notifications from "./notifications";

const ONE_MINUTE = 60 * 1000;

const NotificationButton = () => {
  const [intervalTime, setIntervalTime] = useState(5 * ONE_MINUTE);
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
      showNotification();

      const t = setInterval(() => {
        showNotification();
      }, intervalTime);

      return () => clearInterval(t);
    }
  }, [permissionGranted, intervalTime]);

  React.useEffect(() => {
    const unlisten = listen("interval_changed", (event) => {
      const newIntervalTimeMins = Number(event.payload);
      if (!Number.isNaN(newIntervalTimeMins)) {
        setIntervalTime(newIntervalTimeMins * ONE_MINUTE);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return null;
};

export default NotificationButton;
