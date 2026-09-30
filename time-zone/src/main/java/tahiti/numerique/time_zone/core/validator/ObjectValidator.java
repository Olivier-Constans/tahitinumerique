package tahiti.numerique.time_zone.core.validator;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import tahiti.numerique.time_zone.core.exception.BusinessException;

import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_INVALID;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REFERENCE_NOT_EXIST;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REQUIRED;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ObjectValidator {

    public static void required(Object object, String message, Object... args) {
        if(object == null) {
            throw new BusinessException(message, args);
        }
    }

    public static void required(Object object, String fieldPath) {
        required(object, GENERIC_FORM_REQUIRED, fieldPath);
    }

    public static void valid(Object object, String fieldPath) {
        required(object, GENERIC_FORM_INVALID, fieldPath);
    }

    public static <OBJECT, ID>  OBJECT exist(JpaRepository<OBJECT, ID> repository, ID id, String message, Object... args){
        return  repository.findById(id).orElseThrow(() ->  new BusinessException(message, args));
    }

    public static <OBJECT, ID>  OBJECT exist(JpaRepository<OBJECT, ID> repository, ID id, String fieldPath){
        return exist(repository, id, GENERIC_FORM_REFERENCE_NOT_EXIST, fieldPath);
    }
}
