import * as Sentry from "@sentry/nextjs";
import { getServerSentryOptions } from "@/lib/sentry-options";

const options = getServerSentryOptions();
if (options) {
  Sentry.init(options);
}
