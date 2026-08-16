import * as Sentry from "@sentry/nextjs";
import { getBrowserSentryOptions } from "@/lib/sentry-options";

const options = getBrowserSentryOptions();
if (options) {
  Sentry.init(options);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
