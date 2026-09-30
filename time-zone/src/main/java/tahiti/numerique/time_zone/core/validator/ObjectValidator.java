package tahiti.numerique.time_zone.core.validator;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import tahiti.numerique.time_zone.core.exception.BusinessException;

import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_INVALID;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_MAX_LENGTH;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REFERENCE_NOT_EXIST;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REQUIRED;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ObjectValidator {

    public static void check(boolean condition, String message, Object... args) {
        if(!condition) {
            throw new BusinessException(message, args);
        }
    }

    public static void required(Object object, String fieldPath) {
        check(object != null, GENERIC_FORM_REQUIRED, fieldPath);
    }

    public static void notBlank(String value, String fieldPath) {
        check(value != null && !value.isBlank(), GENERIC_FORM_REQUIRED, fieldPath);
    }

    public static void maxLength(String value, int maxLength, String fieldPath) {
        check(value == null || value.length() <= maxLength, GENERIC_FORM_MAX_LENGTH, fieldPath, maxLength);
    }

    public static void valid(boolean condition, String fieldPath) {
        check(condition, GENERIC_FORM_INVALID, fieldPath);
    }

    public static <OBJECT, ID>  OBJECT exist(JpaRepository<OBJECT, ID> repository, ID id, String message, Object... args){
        return  repository.findById(id).orElseThrow(() ->  new BusinessException(message, args));
    }

    public static <OBJECT, ID>  OBJECT exist(JpaRepository<OBJECT, ID> repository, ID id, String fieldPath){
        return exist(repository, id, GENERIC_FORM_REFERENCE_NOT_EXIST, fieldPath);
    }
}
