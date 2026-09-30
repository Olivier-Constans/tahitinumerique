package tahiti.numerique.time_zone.core.exception;

import lombok.Getter;

import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_NOT_FOUND;

@Getter
public class NotFoundException extends RuntimeException implements MessageException{

    private final MessageExceptionInfo messageExceptionInfo;

    public NotFoundException(String code, Object[] args) {
        super(code);
        messageExceptionInfo = new MessageExceptionInfo(code, args);
    }

    public NotFoundException(String nameObject, Object id) {
        // String.valueOf : évite que MessageFormat formate l'id avec un séparateur de milliers (1234 -> "1 234")
        this(GENERIC_NOT_FOUND, new Object[]{nameObject, String.valueOf(id)});
    }
}
