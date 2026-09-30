package tahiti.numerique.time_zone.core.exception;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tahiti.numerique.time_zone.core.controller.ErrorMessageResponse;

import java.util.Locale;

import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_INTERNAL_ERROR;

@RestControllerAdvice
@RequiredArgsConstructor
public class RestExceptionHandler extends ResponseEntityExceptionHandler {

    private static Logger LOGGER = LoggerFactory.getLogger(RestExceptionHandler.class);

    private final MessageSource messageSource;

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorMessageResponse> handleException(NotFoundException ex) {
        ErrorMessageResponse messageDto = new ErrorMessageResponse(ex.generateMessage(messageSource));
        return new ResponseEntity<>(messageDto, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorMessageResponse> handleException(BusinessException ex) {
        ErrorMessageResponse messageDto = new ErrorMessageResponse(ex.generateMessage(messageSource));
        return new ResponseEntity<>(messageDto, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessageResponse> handleException(Exception ex) {
        LOGGER.error("Une erreur inattendue s'est produite", ex);
        ErrorMessageResponse messageDto = new ErrorMessageResponse(
                messageSource.getMessage(GENERIC_INTERNAL_ERROR, null, Locale.FRENCH));
        return new ResponseEntity<>(messageDto, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}