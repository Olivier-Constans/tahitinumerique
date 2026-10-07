package tahiti.numerique.time_zone.core.exception;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tahiti.numerique.time_zone.core.controller.ErrorMessageResponse;
import tools.jackson.databind.exc.InvalidTypeIdException;

import java.util.Locale;

import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_BAD_REQUEST;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_INVALID;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REQUIRED;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_INTERNAL_ERROR;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_RESOURCE_NOT_FOUND;

@RestControllerAdvice
@RequiredArgsConstructor
public class RestExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(RestExceptionHandler.class);

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

    /**
     * Propriété inconnue dans les paramètres de tri (ex : {@code ?sort=foo}).
     */
    @ExceptionHandler(PropertyReferenceException.class)
    public ResponseEntity<ErrorMessageResponse> handleException(PropertyReferenceException ex) {
        LOGGER.warn("Requête invalide : {}", ex.getMessage());
        ErrorMessageResponse messageDto = new ErrorMessageResponse(
                messageSource.getMessage(GENERIC_BAD_REQUEST, null, Locale.FRENCH));
        return new ResponseEntity<>(messageDto, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessageResponse> handleException(Exception ex) {
        LOGGER.error("Une erreur inattendue s'est produite", ex);
        ErrorMessageResponse messageDto = new ErrorMessageResponse(
                messageSource.getMessage(GENERIC_INTERNAL_ERROR, null, Locale.FRENCH));
        return new ResponseEntity<>(messageDto, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Type absent ou inconnu dans une requête polymorphe ({@code @JsonTypeInfo}) : même message que la validation
     * d'un champ par {@code ObjectValidator}, plutôt que le message générique.
     */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        if (ex.getMostSpecificCause() instanceof InvalidTypeIdException invalidTypeId) {
            var typeInfo = invalidTypeId.getBaseType().getRawClass().getAnnotation(JsonTypeInfo.class);
            if (typeInfo != null && !typeInfo.property().isEmpty()) {
                LOGGER.warn("Requête invalide : {}", ex.getMessage());
                var code = invalidTypeId.getTypeId() == null ? GENERIC_FORM_REQUIRED : GENERIC_FORM_INVALID;
                var message = messageSource.getMessage(code, new Object[]{typeInfo.property()}, Locale.FRENCH);
                return new ResponseEntity<>(new ErrorMessageResponse(message), headers, status);
            }
        }
        return super.handleHttpMessageNotReadable(ex, headers, status, request);
    }

    /**
     * Uniformise les erreurs levées par Spring MVC (JSON invalide, paramètre mal typé...)
     * au format {@link ErrorMessageResponse} au lieu de ProblemDetail.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, @Nullable Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        String code;
        if (statusCode.is5xxServerError()) {
            LOGGER.error("Erreur Spring MVC", ex);
            code = GENERIC_INTERNAL_ERROR;
        } else if (statusCode.isSameCodeAs(HttpStatus.NOT_FOUND)) {
            LOGGER.warn("Ressource introuvable : {}", ex.getMessage());
            code = GENERIC_RESOURCE_NOT_FOUND;
        } else {
            LOGGER.warn("Requête invalide : {}", ex.getMessage());
            code = GENERIC_BAD_REQUEST;
        }
        ErrorMessageResponse messageDto = new ErrorMessageResponse(messageSource.getMessage(code, null, Locale.FRENCH));
        return new ResponseEntity<>(messageDto, headers, statusCode);
    }

}
