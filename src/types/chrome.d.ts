/**
 * Type definitions for Chrome extension APIs
 */

declare namespace chrome {
  export interface Tab {
    id?: number;
    index: number;
    windowId: number;
    highlighted: boolean;
    active: boolean;
    pinned: boolean;
    url?: string;
    title?: string;
  }

  export interface Alarm {
    name: string;
    scheduledTime: number;
    periodInMinutes?: number;
  }

  export interface MessageSender {
    tab?: Tab;
    frameId?: number;
    id?: string;
    url?: string;
    tlsChannelId?: string;
    origin?: string;
  }

  export interface InstalledDetails {
    reason: string;
    previousVersion?: string;
    id?: string;
  }

  export interface StorageArea {
    get(keys?: string | string[] | object | null): Promise<{ [key: string]: any }>;
    set(items: object): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    clear(): Promise<void>;
  }

  export interface Storage {
    local: StorageArea;
    sync: StorageArea;
    managed: StorageArea;
    session: StorageArea;
    onChanged: {
      addListener(callback: (changes: { [key: string]: any }, areaName: string) => void): void;
      removeListener(callback: (changes: { [key: string]: any }, areaName: string) => void): void;
    };
  }

  export interface Tabs {
    get(tabId: number): Promise<Tab>;
    getCurrent(): Promise<Tab>;
    query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
      highlighted?: boolean;
      status?: string;
      title?: string;
      url?: string | string[];
      windowId?: number;
    }): Promise<Tab[]>;
    sendMessage(tabId: number, message: any): Promise<any>;
    onCreated: {
      addListener(callback: (tab: Tab) => void): void;
      removeListener(callback: (tab: Tab) => void): void;
    };
  }

  export interface Alarms {
    create(name: string, alarmInfo: {
      when?: number;
      delayInMinutes?: number;
      periodInMinutes?: number;
    }): void;
    get(name: string): Promise<Alarm>;
    getAll(): Promise<Alarm[]>;
    clear(name: string): Promise<boolean>;
    clearAll(): Promise<boolean>;
    onAlarm: {
      addListener(callback: (alarm: Alarm) => void): void;
      removeListener(callback: (alarm: Alarm) => void): void;
    };
  }

  export interface Runtime {
    onMessage: {
      addListener(
        callback: (
          message: any,
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => boolean | void | Promise<void>
      ): void;
      removeListener(
        callback: (
          message: any,
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => void
      ): void;
    };
    onInstalled: {
      addListener(callback: (details: InstalledDetails) => void): void;
      removeListener(callback: (details: InstalledDetails) => void): void;
    };
  }

  export const storage: Storage;
  export const tabs: Tabs;
  export const alarms: Alarms;
  export const runtime: Runtime;
} 