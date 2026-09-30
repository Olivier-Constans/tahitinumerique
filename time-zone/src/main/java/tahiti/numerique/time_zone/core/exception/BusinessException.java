package tahiti.numerique.time_zone.core.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException implements MessageException{

    private final MessageExceptionInfo messageExceptionInfo;

    public BusinessException(String code, Object[] args) {
        super(code);
        messageExceptionInfo = new MessageExceptionInfo(code, args);
    }
}
