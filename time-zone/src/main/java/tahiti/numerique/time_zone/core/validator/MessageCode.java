package tahiti.numerique.time_zone.core.validator;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class MessageCode {
    public final static String GENERIC_FORM_REQUIRED = "generic.form.required";
    public final static String GENERIC_FORM_INVALID = "generic.form.invalid";
    public final static String GENERIC_FORM_MAX_LENGTH = "generic.form.maxLength";
    public final static String GENERIC_BAD_REQUEST = "generic.badRequest";
    public final static String GENERIC_INTERNAL_ERROR = "generic.internalError";
    public final static String GENERIC_FORM_REFERENCE_NOT_EXIST = "generic.form.reference.not-exist";
    public final static String GENERIC_NOT_FOUND = "generic.notFound";
    public final static String GENERIC_RESOURCE_NOT_FOUND = "generic.resourceNotFound";
}
