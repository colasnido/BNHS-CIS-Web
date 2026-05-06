import type { ImportConfig } from "@/lib/csv/import-config";
import {
  normalizeDay,
  normalizeTime,
  normalizeFreeText,
} from "@/lib/csv/normalizers";

interface NormalizedScheduleRow {
  subjectName: string;
  classSection: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  [key: string]: unknown;
}

export const schedulesImportConfig: ImportConfig<NormalizedScheduleRow> = {
  datasetLabel: "Schedules",
  itemNoun: { singular: "schedule", plural: "schedules" },

  fields: [
    {
      key: "subjectName",
      label: "Subject",
      required: true,
      aliases: [
        "subjectname",
        "subject name",
        "subject",
        "course",
        "course name",
        "coursename",
      ],
      hint: "The subject as named in the Subjects list. Must already exist in the system.",
    },
    {
      key: "classSection",
      label: "Class Section",
      required: true,
      aliases: [
        "classsection",
        "class section",
        "section",
        "class",
        "class name",
        "classname",
      ],
      hint: 'The class section name (e.g., "St. Augustine").',
    },
    {
      key: "dayOfWeek",
      label: "Day of Week",
      required: true,
      aliases: ["dayofweek", "day of week", "day", "weekday", "days"],
      hint: 'Accepts "Mon", "Monday", "MON", etc.',
    },
    {
      key: "startTime",
      label: "Start Time",
      required: true,
      aliases: [
        "starttime",
        "start time",
        "start",
        "from",
        "begin",
        "begintime",
        "begin time",
      ],
      hint: 'Accepts "08:00", "8:00 AM", "8am", etc.',
    },
    {
      key: "endTime",
      label: "End Time",
      required: true,
      aliases: [
        "endtime",
        "end time",
        "end",
        "to",
        "finish",
        "finishtime",
        "finish time",
      ],
      hint: 'Accepts "09:00", "9:00 AM", "9am", etc.',
    },
    {
      key: "room",
      label: "Room",
      required: false,
      aliases: ["room", "venue", "location", "classroom", "room number"],
    },
  ],

  normalizeRow(raw) {
    const subjectName = raw.subjectName
      ? normalizeFreeText(raw.subjectName)
      : "";
    if (!subjectName) return { ok: false, error: "Subject is required" };

    const classSection = raw.classSection
      ? normalizeFreeText(raw.classSection)
      : "";
    if (!classSection) return { ok: false, error: "Class section is required" };

    const dayRaw = raw.dayOfWeek?.trim();
    if (!dayRaw) return { ok: false, error: "Day of week is required" };
    const dayOfWeek = normalizeDay(dayRaw);
    if (!dayOfWeek) {
      return {
        ok: false,
        error: `Unknown day "${dayRaw}". Use Mon–Sun or full names.`,
      };
    }

    const startRaw = raw.startTime?.trim();
    if (!startRaw) return { ok: false, error: "Start time is required" };
    const startTime = normalizeTime(startRaw);
    if (!startTime) {
      return {
        ok: false,
        error: `Could not parse start time "${startRaw}". Try formats like "08:00" or "8:00 AM".`,
      };
    }

    const endRaw = raw.endTime?.trim();
    if (!endRaw) return { ok: false, error: "End time is required" };
    const endTime = normalizeTime(endRaw);
    if (!endTime) {
      return {
        ok: false,
        error: `Could not parse end time "${endRaw}". Try formats like "09:00" or "9:00 AM".`,
      };
    }

    if (startTime >= endTime) {
      return {
        ok: false,
        error: `End time (${endTime}) must be after start time (${startTime})`,
      };
    }

    const row: NormalizedScheduleRow = {
      subjectName,
      classSection,
      dayOfWeek,
      startTime,
      endTime,
    };
    if (raw.room) row.room = normalizeFreeText(raw.room);
    return { ok: true, row };
  },

  apiEndpoint: "/api/csv-import/schedules",

  templateCsv: `subject,class_section,day,start_time,end_time,room
Mathematics 7,St. Augustine,Mon,08:00,09:00,Room 201
Mathematics 7,St. Augustine,Wed,08:00,09:00,Room 201
English 7,St. Augustine,Mon,09:00 AM,10:00 AM,Room 201
`,
};
