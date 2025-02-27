/**
 * Type definitions for Chrome extension APIs
 */

declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: object, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
      getBytesInUse(keys: string | string[] | null, callback: (bytesInUse: number) => void): void;
    }

    interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }

    const sync: StorageArea;
    const local: StorageArea;
    const managed: StorageArea;
    const session: StorageArea;

    function onChanged(callback: (changes: { [key: string]: StorageChange }, areaName: string) => void): void;
  }

  namespace runtime {
    interface LastError {
      message?: string;
    }

    const lastError: LastError | undefined;

    function getURL(path: string): string;
    function getManifest(): any;
    function reload(): void;
    function restart(): void;
    function connect(extensionId?: string, connectInfo?: { name?: string; includeTlsChannelId?: boolean }): any;
    function sendMessage(message: any, responseCallback?: (response: any) => void): void;
    function sendMessage(extensionId: string, message: any, responseCallback?: (response: any) => void): void;
    function sendMessage(
      extensionId: string,
      message: any,
      options: { includeTlsChannelId?: boolean },
      responseCallback?: (response: any) => void
    ): void;

    function onMessage(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void): void;
    function onConnect(callback: (port: any) => void): void;
    function onInstalled(callback: (details: { reason: string; previousVersion?: string }) => void): void;
    function onStartup(callback: () => void): void;
    function onSuspend(callback: () => void): void;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      index: number;
      windowId: number;
      openerTabId?: number;
      highlighted: boolean;
      active: boolean;
      pinned: boolean;
      audible?: boolean;
      discarded: boolean;
      autoDiscardable: boolean;
      mutedInfo?: {
        muted: boolean;
      };
      url?: string;
      title?: string;
      favIconUrl?: string;
      status?: string;
      incognito: boolean;
      width?: number;
      height?: number;
      sessionId?: string;
    }

    function query(queryInfo: {
      active?: boolean;
      audible?: boolean;
      currentWindow?: boolean;
      highlighted?: boolean;
      index?: number;
      muted?: boolean;
      pinned?: boolean;
      status?: string;
      title?: string;
      url?: string | string[];
      windowId?: number;
      windowType?: string;
    }, callback: (result: Tab[]) => void): void;

    function create(createProperties: {
      active?: boolean;
      index?: number;
      openerTabId?: number;
      pinned?: boolean;
      url?: string;
      windowId?: number;
    }, callback?: (tab: Tab) => void): void;

    function update(tabId: number | undefined, updateProperties: {
      active?: boolean;
      autoDiscardable?: boolean;
      highlighted?: boolean;
      muted?: boolean;
      openerTabId?: number;
      pinned?: boolean;
      url?: string;
    }, callback?: (tab?: Tab) => void): void;

    function remove(tabIds: number | number[], callback?: () => void): void;
  }

  namespace i18n {
    function getMessage(messageName: string, substitutions?: string | string[]): string;
    function getAcceptLanguages(callback: (languages: string[]) => void): void;
    function detectLanguage(text: string, callback: (result: { isReliable: boolean; languages: { language: string; percentage: number }[] }) => void): void;
  }

  namespace action {
    function setIcon(details: {
      imageData?: ImageData | { [size: string]: ImageData };
      path?: string | { [size: string]: string };
      tabId?: number;
    }, callback?: () => void): void;

    function setBadgeText(details: {
      text: string;
      tabId?: number;
    }, callback?: () => void): void;

    function setBadgeBackgroundColor(details: {
      color: string | { [key: string]: number };
      tabId?: number;
    }, callback?: () => void): void;

    function setTitle(details: {
      title: string;
      tabId?: number;
    }, callback?: () => void): void;

    function setPopup(details: {
      popup: string;
      tabId?: number;
    }, callback?: () => void): void;
  }

  namespace alarms {
    interface Alarm {
      name: string;
      scheduledTime: number;
      periodInMinutes?: number;
    }

    function create(name: string, alarmInfo: {
      when?: number;
      delayInMinutes?: number;
      periodInMinutes?: number;
    }): void;

    function get(name: string, callback: (alarm: Alarm) => void): void;
    function getAll(callback: (alarms: Alarm[]) => void): void;
    function clear(name: string, callback?: (wasCleared: boolean) => void): void;
    function clearAll(callback?: (wasCleared: boolean) => void): void;

    function onAlarm(callback: (alarm: Alarm) => void): void;
  }

  namespace permissions {
    interface Permissions {
      permissions?: string[];
      origins?: string[];
    }

    function contains(permissions: Permissions, callback: (result: boolean) => void): void;
    function request(permissions: Permissions, callback: (granted: boolean) => void): void;
    function remove(permissions: Permissions, callback?: (removed: boolean) => void): void;
    function getAll(callback: (permissions: Permissions) => void): void;

    function onAdded(callback: (permissions: Permissions) => void): void;
    function onRemoved(callback: (permissions: Permissions) => void): void;
  }
} 