import React, { useState } from "react";
import { cn, formatMinutesToHours } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { MonthlyReport } from "@shared/schema";
import { motion } from "framer-motion";

interface MonthCardProps {
  report: MonthlyReport;
  className?: string;
}

const MONTH_NAMES = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

export function MonthCard({ report, className }: MonthCardProps) {
  const progressPercentage =
    report.targetMinutes > 0
      ? (report.workedMinutes / report.targetMinutes) * 100
      : 0;

  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn("bg-card mb-4", className, isHovered ? "shadow-lg" : "")}
      >
        <CardContent className="p-4">
          <motion.h4
            className="font-medium"
            animate={{ color: isHovered ? "#4ade80" : "#e0e0e0" }}
            transition={{ duration: 0.2 }}
          >
            {MONTH_NAMES[report.month - 1]}
          </motion.h4>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <span className="text-sm">Робочі дні:</span>
              <span className="ml-2 font-medium">{report.workDays} д</span>
            </div>
          </div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Progress
              className="h-2 mt-4 bg-gray-700"
              value={progressPercentage}
            />
          </motion.div>

          <div className="flex justify-between text-sm mt-2">
            <motion.span
              animate={{ opacity: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {formatMinutesToHours(report.workedMinutes)} ч /{" "}
              {formatMinutesToHours(Math.abs(report.targetMinutes))} ч
            </motion.span>
            <motion.span
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              0,00 ₴
            </motion.span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
