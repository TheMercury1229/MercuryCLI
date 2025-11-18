import prisma from "../lib/db.js";

export class ChatService {
  parseContent(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      return content;
    }
  }
  /**
   * Create a new conversation with the given user and mode.
   * @param {string} userId - The user id.
   * @param {string} mode - The conversation mode, "chat" or "group chat".
   * @param {string|null} title - The conversation title.
   * @returns {Promise<void>} - A promise that resolves when the conversation is created.
   */
  async createConversation(userId, mode = "chat", title = null) {
    return await prisma.conversation.create({
      data: {
        userId: userId,
        mode: mode,
        title: title || `New ${mode} Conversation`,
      },
    });
  }

  /**
   * Get a conversation by its id, or create a new one if it does not exist.
   * @param {string} userId - The user id.
   * @param {string} mode - The conversation mode, "chat" or "group chat".
   * @param {string|null} conversationId - The conversation id.
   * @returns {Promise<Conversation & { messages: Message[] }>} - A promise that resolves with the conversation.
   */
  async getOrCreateConversation(userId, mode = "chat", conversationId = null) {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (conversation) {
        return conversation;
      }
    }

    // Create new conversation and fetch it with messages
    const newConversation = await this.createConversation(userId, mode);
    return (
      (await prisma.conversation.findFirst({
        where: {
          id: newConversation.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      })) || { ...newConversation, messages: [] }
    );
  }

  /**
   * Add a message to a conversation.
   * @param {string} conversationId - The conversation id.
   * @param {string} role - The role of the message, "user" or "assistant".
   * @param {string|object} content - The message content.
   * @returns {Promise<Message>} - A promise that resolves with the created message.
   */
  async addMessage(conversationId, role, content) {
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);
    return await prisma.message.create({
      data: {
        conversationId: conversationId,
        role: role,
        content: contentStr,
      },
    });
  }

  /**
   * Get the messages of a conversation.
   * @param {string} conversationId - The conversation id.
   * @returns {Promise<import("@prisma/client").Message[]>} - A promise that resolves with the messages of the conversation.
   */
  async getConversationMessages(conversationId) {
    if (!conversationId) {
      return [];
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      orderBy: { createdAt: "asc" },
    });

    return messages
      ? messages.map((msg) => ({
          ...msg,
          content: this.parseContent(msg.content),
        }))
      : [];
  }

  /**
   * Get the conversations of a user
   * * @param {string} userId - The user id.
   * @returns {Promise<import("@prisma/client").Conversation[]>} - A promise that resolves with the conversations of the user.
   *
   **/
  async getUserConversations(userId) {
    return await prisma.conversation.findMany({
      where: {
        userId: userId,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }
  /**
   * Delete a conversation by its id and user id.
   * @param {string} conversationId - The conversation id.
   * @param {string} userId - The user id.
   * @returns {Promise<void>} - A promise that resolves when the conversation is deleted.
   */

  async deleteConversation(conversationId, userId) {
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId: userId,
      },
    });
  }

  /**
   * Update the title of a conversation.
   * @param {string} conversationId - The conversation id.
   * @param {string} userId - The user id.
   * @param {string} title - The new title of the conversation.
   * @returns {Promise<void>} - A promise that resolves when the title is updated.
   */
  async updateTitle(conversationId, userId, title) {
    return await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        userId: userId,
      },
      data: {
        title: title,
      },
    });
  }

  formatMessagesForAI(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));
  }
}
