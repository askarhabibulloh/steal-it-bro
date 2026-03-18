(function (global) {
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const WEEKDAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function ordinal(value) {
    const remainder = value % 100;
    if (remainder >= 11 && remainder <= 13) return `${value}th`;
    switch (value % 10) {
      case 1:
        return `${value}st`;
      case 2:
        return `${value}nd`;
      case 3:
        return `${value}rd`;
      default:
        return `${value}th`;
    }
  }

  function splitParts(expr) {
    return String(expr || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function formatList(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }

  function parseStep(part) {
    const match = String(part).match(/^\*\/(\d+)$/);
    if (!match) return null;
    return Number(match[1]);
  }

  function parseRange(part) {
    const match = String(part).match(/^(\d+)-(\d+)$/);
    if (!match) return null;
    return { start: Number(match[1]), end: Number(match[2]) };
  }

  function parseList(part) {
    if (!String(part).includes(",")) return null;
    return String(part)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  function describeValue(value, kind) {
    if (kind === "month") {
      const numeric = Number(value);
      return MONTH_NAMES[numeric - 1] || value;
    }

    if (kind === "weekday") {
      const numeric = Number(value);
      if (numeric === 7) return "Sunday";
      return WEEKDAY_NAMES[numeric] || value;
    }

    if (/^\d+$/.test(value)) {
      return kind === "day" ? ordinal(Number(value)) : value;
    }

    return value;
  }

  function describeField(part, kind) {
    const value = String(part || "*").trim() || "*";

    if (value === "*") {
      return { type: "any" };
    }

    const step = parseStep(value);
    if (step) {
      return { type: "step", step };
    }

    const range = parseRange(value);
    if (range) {
      return {
        type: "range",
        start: describeValue(String(range.start), kind),
        end: describeValue(String(range.end), kind),
      };
    }

    const list = parseList(value);
    if (list) {
      return {
        type: "list",
        values: list.map((item) => describeValue(item, kind)),
      };
    }

    return { type: "single", value: describeValue(value, kind) };
  }

  function describeSet(descriptor, unit) {
    if (descriptor.type === "any") return `every ${unit}`;
    if (descriptor.type === "step") {
      return `every ${descriptor.step} ${unit}${descriptor.step === 1 ? "" : "s"}`;
    }
    if (descriptor.type === "range") {
      return `${descriptor.start} through ${descriptor.end}`;
    }
    if (descriptor.type === "list") {
      return formatList(descriptor.values);
    }
    return descriptor.value;
  }

  function describeTime(minute, hour) {
    const minuteDescriptor = describeField(minute, "minute");
    const hourDescriptor = describeField(hour, "hour");

    if (minuteDescriptor.type === "any" && hourDescriptor.type === "any") {
      return "Every minute";
    }

    if (minuteDescriptor.type === "step" && hourDescriptor.type === "any") {
      return `Every ${minuteDescriptor.step} minutes`;
    }

    if (
      minuteDescriptor.type === "single" &&
      hourDescriptor.type === "single" &&
      /^\d+$/.test(String(minute)) &&
      /^\d+$/.test(String(hour))
    ) {
      return `At ${pad2(Number(hour))}:${pad2(Number(minute))}`;
    }

    if (minuteDescriptor.type === "single" && hourDescriptor.type === "any") {
      return `At minute ${minuteDescriptor.value} past every hour`;
    }

    if (minuteDescriptor.type === "any" && hourDescriptor.type === "single") {
      return `Every minute during ${pad2(Number(hourDescriptor.value))}:00`;
    }

    if (minuteDescriptor.type === "step" && hourDescriptor.type === "single") {
      return `Every ${minuteDescriptor.step} minutes during ${pad2(Number(hourDescriptor.value))}:00`;
    }

    if (minuteDescriptor.type === "list" && hourDescriptor.type === "single") {
      return `At ${formatList(
        minuteDescriptor.values.map((value) => pad2(Number(value))),
      )} minutes past ${pad2(Number(hourDescriptor.value))}:00`;
    }

    if (minuteDescriptor.type === "single" && hourDescriptor.type === "list") {
      return `At ${formatList(
        hourDescriptor.values.map(
          (value) =>
            `${pad2(Number(value))}:${pad2(Number(minuteDescriptor.value))}`,
        ),
      )}`;
    }

    if (minuteDescriptor.type === "list" && hourDescriptor.type === "list") {
      const times = [];
      hourDescriptor.values.forEach((hourValue) => {
        minuteDescriptor.values.forEach((minuteValue) => {
          times.push(`${pad2(Number(hourValue))}:${pad2(Number(minuteValue))}`);
        });
      });
      return `At ${formatList(times)}`;
    }

    if (minuteDescriptor.type === "single" && hourDescriptor.type === "step") {
      return `Every ${hourDescriptor.step} hours at ${pad2(Number(minuteDescriptor.value))} minutes`;
    }

    return "Every minute";
  }

  function describeDates(day, month, weekday) {
    const pieces = [];
    const dayDescriptor = describeField(day, "day");
    const monthDescriptor = describeField(month, "month");
    const weekdayDescriptor = describeField(weekday, "weekday");

    if (dayDescriptor.type !== "any") {
      const dayText = describeSet(dayDescriptor, "day");
      pieces.push(`on ${dayText}`);
    }

    if (monthDescriptor.type !== "any") {
      const monthText = describeSet(monthDescriptor, "month");
      pieces.push(`in ${monthText}`);
    }

    if (weekdayDescriptor.type !== "any") {
      const weekdayText = describeSet(weekdayDescriptor, "weekday");
      pieces.push(`on ${weekdayText}`);
    }

    if (pieces.length === 0) return "";
    return ` ${pieces.join(" ")}`;
  }

  function describeCronExpression(expr) {
    const parts = splitParts(expr);

    if (parts.length !== 5) {
      return "Enter a valid 5-field cron expression.";
    }

    const [minute, hour, day, month, weekday] = parts;
    const timeText = describeTime(minute, hour);
    const dateText = describeDates(day, month, weekday);

    return `${timeText}${dateText}.`;
  }

  global.CronUtils = {
    describeCronExpression,
  };
})(window);
