package tahiti.numerique.time_zone.core.exception;

import org.springframework.context.MessageSource;

import java.util.Locale;

interface MessageException {

    MessageExceptionInfo getMessageExceptionInfo();

    default String generateMessage(MessageSource messageSource) {
        var messageExceptionInfo = getMessageExceptionInfo();
        return messageSource.getMessage(messageExceptionInfo.getCode(), messageExceptionInfo.getArgs(), Locale.FRENCH);
    }

}
