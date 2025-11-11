import { storage } from "@vendetta/plugin";

// Initialize default storage values
storage.targetUserId ??= "";
storage.senderUserId ??= "";
storage.messageContent ??= "";
storage.embedTitle ??= "";
storage.embedDescription ??= "";
storage.embedImageUrl ??= "";
storage.useEmbed ??= false;

export const onUnload = () => {
  // Cleanup if needed
};

export { default as settings } from "./settings";
