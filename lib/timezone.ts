import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz"
import { format } from "date-fns"

export const APP_TIMEZONE = "America/Chicago"

export function formatInAppTimezone(
  date: Date | string,
  formatStr: string
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatInTimeZone(dateObj, APP_TIMEZONE, formatStr)
}

export function toAppTimezone(date: Date): Date {
  return toZonedTime(date, APP_TIMEZONE)
}

export function fromAppTimezone(date: Date): Date {
  return fromZonedTime(date, APP_TIMEZONE)
}

export function parseISOInTimezone(isoString: string): Date {
  // Parse ISO string and interpret it in app timezone
  const date = new Date(isoString)
  return toAppTimezone(date)
}
