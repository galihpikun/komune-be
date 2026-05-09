import connection from "../lib/db.js";

export const createNotification = async ({
  user_id,
  sender_id = null,
  type,
  reference_id = null,
}) => {
  try {
    await connection.query(
      `
            INSERT INTO notifications
            (
                user_id,
                sender_id,
                type,
                reference_id
            )
            VALUES (?, ?, ?, ?)
            `,
      [user_id, sender_id, type, reference_id],
    );
  } catch (error) {
    console.error("Create notification error:", error.message);
  }
};
