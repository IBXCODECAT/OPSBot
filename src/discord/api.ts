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
