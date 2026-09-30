package tahiti.numerique.time_zone.core.validator;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.context.MessageSource;
import org.springframework.data.jpa.repository.JpaRepository;
import tahiti.numerique.time_zone.core.exception.BusinessException;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_MAX_LENGTH;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REFERENCE_NOT_EXIST;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REQUIRED;

public class ObjectValidatorTest {

    @Test
    void testRequiredWithObjectNull() {
        var messageError = "messageError";
        var field = "field";

        MessageSource messageSource = Mockito.mock(MessageSource.class);
        when(messageSource.getMessage(GENERIC_FORM_REQUIRED, new String[]{field}, Locale.FRENCH)).thenReturn(messageError);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                ObjectValidator.required(null, field)
        );

        assertEquals(messageError, exception.generateMessage(messageSource));
    }

    @Test
    void testRequiredWithObjectNotNull() {
        assertDoesNotThrow(() ->
                ObjectValidator.required(new Object(), "field")
        );
    }

    @Test
    void testExistWhenObjectExists() {
        JpaRepository<Object, Long> repository = Mockito.mock(JpaRepository.class);
        Long id = 1L;
        Object expectedObject = new Object();

        when(repository.findById(id)).thenReturn(java.util.Optional.of(expectedObject));

        Object actualObject = ObjectValidator.exist(repository, id, "field");

        assertEquals(expectedObject, actualObject);
    }

    @Test
    void testExistWhenObjectDoesNotExist() {
        JpaRepository<Object, Long> repository = Mockito.mock(JpaRepository.class);
        MessageSource messageSource = Mockito.mock(MessageSource.class);

        var messageError = "messageError";
        var field = "field";

        Long id = 1L;

        when(repository.findById(id)).thenReturn(java.util.Optional.empty());
        when(messageSource.getMessage(GENERIC_FORM_REFERENCE_NOT_EXIST, new String[]{field}, Locale.FRENCH)).thenReturn(messageError);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                ObjectValidator.exist(repository, id, field)
        );

        assertEquals(messageError, exception.generateMessage(messageSource));
    }

    @Test
    void testNotBlank() {
        assertDoesNotThrow(() -> ObjectValidator.notBlank("value", "field"));
        assertThrows(BusinessException.class, () -> ObjectValidator.notBlank(null, "field"));
        assertThrows(BusinessException.class, () -> ObjectValidator.notBlank("  ", "field"));
    }

    @Test
    void testMaxLength() {
        var messageError = "messageError";
        MessageSource messageSource = Mockito.mock(MessageSource.class);
        when(messageSource.getMessage(GENERIC_FORM_MAX_LENGTH, new Object[]{"field", 3}, Locale.FRENCH)).thenReturn(messageError);

        assertDoesNotThrow(() -> ObjectValidator.maxLength("abc", 3, "field"));
        assertDoesNotThrow(() -> ObjectValidator.maxLength(null, 3, "field"));
        BusinessException exception = assertThrows(BusinessException.class, () ->
                ObjectValidator.maxLength("abcd", 3, "field")
        );

        assertEquals(messageError, exception.generateMessage(messageSource));
    }

    @Test
    void testValid() {
        assertDoesNotThrow(() -> ObjectValidator.valid(true, "field"));
        assertThrows(BusinessException.class, () -> ObjectValidator.valid(false, "field"));
    }
}
