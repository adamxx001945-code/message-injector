import { ReactNative as RN, clipboard } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { showToast } from "@vendetta/ui/toasts";
import { findByProps } from "@vendetta/metro";

const { FormIcon, FormRow, FormSwitchRow, FormDivider, FormInput, FormText } = Forms;

const FluxDispatcher = findByProps("dispatch", "subscribe");
const UserStore = findByProps("getCurrentUser", "getUser");
const ChannelStore = findByProps("getChannel", "getDMFromUserId");

export default () => {
  useProxy(storage);

  const injectFakeMessage = async (isQuickTest = false) => {
    try {
      let targetUserId = storage.targetUserId?.trim();
      let senderUserId = storage.senderUserId?.trim();
      let content = isQuickTest ? "This is a quick test message!" : storage.messageContent?.trim();

      if (!targetUserId) {
        showToast("❌ Please enter a Target User ID", getAssetIDByName("Small"));
        return;
      }

      if (!senderUserId) {
        showToast("❌ Please enter a Sender User ID", getAssetIDByName("Small"));
        return;
      }

      if (!content && !storage.useEmbed) {
        showToast("❌ Please enter message content", getAssetIDByName("Small"));
        return;
      }

      const channelId = ChannelStore.getDMFromUserId(targetUserId);
      
      if (!channelId) {
        showToast("❌ Could not find DM with target user", getAssetIDByName("Small"));
        return;
      }

      const sender = await UserStore.getUser(senderUserId);
      
      if (!sender) {
        showToast("❌ Could not find sender user", getAssetIDByName("Small"));
        return;
      }

      const fakeMessage: any = {
        id: String(Date.now()) + Math.random().toString(36).substr(2, 9),
        channel_id: channelId,
        author: {
          id: sender.id,
          username: sender.username,
          discriminator: sender.discriminator,
          avatar: sender.avatar,
          bot: sender.bot || false,
          public_flags: sender.publicFlags || 0,
        },
        content: content || "",
        timestamp: new Date().toISOString(),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        attachments: [],
        embeds: [],
        reactions: [],
        pinned: false,
        type: 0,
        flags: 0,
        state: "SENT",
      };

      if (storage.useEmbed && (storage.embedTitle || storage.embedDescription || storage.embedImageUrl)) {
        const embed: any = {
          type: "rich",
        };

        if (storage.embedTitle?.trim()) {
          embed.title = storage.embedTitle.trim();
        }

        if (storage.embedDescription?.trim()) {
          embed.description = storage.embedDescription.trim();
        }

        if (storage.embedImageUrl?.trim()) {
          embed.image = {
            url: storage.embedImageUrl.trim(),
          };
        }

        fakeMessage.embeds.push(embed);
      }

      FluxDispatcher.dispatch({
        type: "MESSAGE_CREATE",
        channelId: channelId,
        message: fakeMessage,
        optimistic: false,
      });

      showToast("✅ Fake message sent!", getAssetIDByName("Check"));

    } catch (error) {
      console.error("[Message Injector] Error:", error);
      showToast("❌ Failed to send fake message: " + error.message, getAssetIDByName("Small"));
    }
  };

  const pasteFromClipboard = async (field: "target" | "sender") => {
    try {
      const text = await clipboard.getString();
      if (text) {
        if (field === "target") {
          storage.targetUserId = text.trim();
        } else {
          storage.senderUserId = text.trim();
        }
        showToast("📋 Pasted!", getAssetIDByName("toast_copy_link"));
      }
    } catch (error) {
      showToast("❌ Failed to paste", getAssetIDByName("Small"));
    }
  };

  return (
    <RN.ScrollView style={{ flex: 1 }}>
      <FormRow
        label="MESSAGE FAKER"
        leading={<FormIcon source={getAssetIDByName("ic_message_edit")} />}
      />
      <FormText style={{ marginHorizontal: 16, marginBottom: 16, opacity: 0.7 }}>
        Inject fake messages into DMs from anyone.
      </FormText>

      <FormDivider />

      <FormRow
        label="CREATE FAKE MESSAGE"
        leading={<FormIcon source={getAssetIDByName("ic_message_edit")} />}
      />
      <FormText style={{ marginHorizontal: 16, marginBottom: 16, opacity: 0.7 }}>
        Create a fake message in someone's DM
      </FormText>

      <FormDivider />

      <FormText style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
        TARGET USER ID (Whose DM)
      </FormText>
      <FormInput
        value={storage.targetUserId}
        onChange={(val: string) => storage.targetUserId = val}
        placeholder="User ID of person whose DM you want to inject into"
        style={{ marginHorizontal: 16, marginBottom: 8 }}
      />
      <RN.TouchableOpacity
        style={{
          backgroundColor: "#5865F2",
          marginHorizontal: 16,
          marginBottom: 16,
          padding: 16,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => pasteFromClipboard("target")}
      >
        <FormIcon source={getAssetIDByName("toast_copy_link")} style={{ tintColor: "white", marginRight: 8 }} />
        <RN.Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Paste Target User ID
        </RN.Text>
      </RN.TouchableOpacity>

      <FormText style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
        FROM USER ID (Who message is from)
      </FormText>
      <FormInput
        value={storage.senderUserId}
        onChange={(val: string) => storage.senderUserId = val}
        placeholder="User ID of who the message appears to be from"
        style={{ marginHorizontal: 16, marginBottom: 8 }}
      />
      <RN.TouchableOpacity
        style={{
          backgroundColor: "#5865F2",
          marginHorizontal: 16,
          marginBottom: 16,
          padding: 16,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => pasteFromClipboard("sender")}
      >
        <FormIcon source={getAssetIDByName("toast_copy_link")} style={{ tintColor: "white", marginRight: 8 }} />
        <RN.Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          Paste Sender User ID
        </RN.Text>
      </RN.TouchableOpacity>

      <FormText style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
        MESSAGE CONTENT
      </FormText>
      <FormInput
        value={storage.messageContent}
        onChange={(val: string) => storage.messageContent = val}
        placeholder="The message text"
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      />

      <FormDivider />

      <FormRow
        label="Optional: Add an embed"
        leading={<FormIcon source={getAssetIDByName("ic_link")} />}
      />
      <FormSwitchRow
        label="Enable Embed"
        value={storage.useEmbed}
        onValueChange={(val: boolean) => storage.useEmbed = val}
      />

      {storage.useEmbed && (
        <>
          <FormText style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
            EMBED TITLE
          </FormText>
          <FormInput
            value={storage.embedTitle}
            onChange={(val: string) => storage.embedTitle = val}
            placeholder="Optional embed title"
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          />

          <FormText style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
            EMBED DESCRIPTION
          </FormText>
          <FormInput
            value={storage.embedDescription}
            onChange={(val: string) => storage.embedDescription = val}
            placeholder="Optional embed description"
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          />

          <FormText style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
            EMBED IMAGE URL
          </FormText>
          <FormInput
            value={storage.embedImageUrl}
            onChange={(val: string) => storage.embedImageUrl = val}
            placeholder="Optional image URL"
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          />
        </>
      )}

      <FormDivider />

      <RN.TouchableOpacity
        style={{
          backgroundColor: "#3BA55D",
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 8,
          padding: 16,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => injectFakeMessage(false)}
      >
        <FormIcon source={getAssetIDByName("ic_message_edit")} style={{ tintColor: "white", marginRight: 8 }} />
        <RN.Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
          ✉️ Send Fake Message
        </RN.Text>
      </RN.TouchableOpacity>

      <RN.TouchableOpacity
        style={{
          backgroundColor: "#F26522",
          marginHorizontal: 16,
          marginBottom: 32,
          padding: 16,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => injectFakeMessage(true)}
      >
        <FormIcon source={getAssetIDByName("ic_message_edit")} style={{ tintColor: "white", marginRight: 8 }} />
        <RN.Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
          ✏️ Quick Test Message
        </RN.Text>
      </RN.TouchableOpacity>
    </RN.ScrollView>
  );
};
