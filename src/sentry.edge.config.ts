import * as Sentry from "@sentry/nextjs";
import { getEdgeSentryOptions } from "@/lib/sentry-options";

const options = getEdgeSentryOptions();
if (options) {
  Sentry.init(options);
}
