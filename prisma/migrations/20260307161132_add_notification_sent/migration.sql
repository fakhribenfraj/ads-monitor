-- CreateTable
CREATE TABLE "NotificationSent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "NotificationSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationSent_userId_idx" ON "NotificationSent"("userId");

-- CreateIndex
CREATE INDEX "NotificationSent_notificationId_idx" ON "NotificationSent"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSent_userId_notificationId_key" ON "NotificationSent"("userId", "notificationId");

-- AddForeignKey
ALTER TABLE "NotificationSent" ADD CONSTRAINT "NotificationSent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSent" ADD CONSTRAINT "NotificationSent_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
