import { z } from "zod";
import { sessions } from "../lib/sessions";
import { sessionSchema } from "../helpers/schema-validations";
import { openai } from "../lib/openai";

export const getMessagesInputSchema = z.object({
  session: sessionSchema,
  limit: z.number().int().min(1).max(100).optional(),
  // Acts as a cursor.
  after: z.string().min(1).optional(),
});

export type GetMessagesOutput = {
  role: "user" | "assistant";
  content: string;
}[];

export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const retrieveMessages = async ({
  session,
  after,
  limit,
}: GetMessagesInput): Promise<GetMessagesOutput> => {
  const messages = await openai.beta.threads.messages.list(
    sessions[session].threadId,
    {
      limit: limit ?? 15,
      after,
      // asc vs desc
      order: "desc", // From newest.
    },
  );

  return messages.data.reverse().map((m) => {
    if (m.content[0].type === "image_file")
      throw new Error("Image files are not supported rn.");

    return {
      role: m.role,
      content: m.content[0].text.value,
    };
  });
};
