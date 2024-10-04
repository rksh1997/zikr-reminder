import React, { useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { enable, isEnabled } from "tauri-plugin-autostart-api";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/api/notification";

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

    if (!(await isEnabled())) {
      await enable();
    }
  };

  const showNotification = () => {
    const notification =
      notifications[Math.floor(Math.random() * notifications.length)];

    let title;
    switch (notification.category) {
      case "duaa":
        title = "ادع الله";
        break;
      case "tazkeer":
        title = "تذكر قدواتك";
        break;
      case "tajdeed":
        title = "جدد إيمانك";
        break;
      default:
        title = "اذكر الله";
        break;
    }

    sendNotification({
      title: title,
      body: notification.text,
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
    const unlistenInterval = listen("interval_changed", (event) => {
      const newIntervalTimeMins = Number(event.payload);
      if (!Number.isNaN(newIntervalTimeMins)) {
        setIntervalTime(newIntervalTimeMins * ONE_MINUTE);
      }
    });

    return () => {
      unlistenInterval.then((fn) => fn());
    };
  }, []);

  return null;
};

export default NotificationButton;
