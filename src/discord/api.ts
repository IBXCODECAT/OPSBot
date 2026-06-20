export interface ChannelInfo {
  id: string;
  parent_id?: string | null;
  applied_tags?: string[];
  available_tags?: Array<{ id: string; name: string }>;
}

export async function getChannelInfo(
  channelId: string,
  botToken: string
): Promise<ChannelInfo | null> {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<ChannelInfo>;
}

export async function patchThread(
  channelId: string,
  body: { archived?: boolean; applied_tags?: string[] },
  botToken: string
): Promise<boolean> {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// Sends a regular (public) message to a channel. Returns true on success.
export async function sendChannelMessage(
  channelId: string,
  content: string,
  botToken: string
): Promise<boolean> {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({ content }),
  });
  return res.ok;
}

// Edits the deferred interaction response (@original).
export async function editInteractionResponse(
  appId: string,
  token: string,
  botToken: string,
  content: string
): Promise<void> {
  await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({ content }),
  });
}

// Posts a followup to the interaction. Public by default; pass flags: 64 for ephemeral.
export async function sendFollowup(
  appId: string,
  token: string,
  botToken: string,
  payload: { content: string; flags?: number }
): Promise<void> {
  await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({
      content: payload.content,
      flags: payload.flags ?? 0,
    }),
  });
}
