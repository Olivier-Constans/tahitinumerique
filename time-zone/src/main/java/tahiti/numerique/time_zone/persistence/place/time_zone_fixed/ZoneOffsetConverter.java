package tahiti.numerique.time_zone.persistence.place.time_zone_fixed;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.ZoneOffset;

/**
 * Stocke un décalage par son identifiant ISO-8601 (ex : {@code -10:00}, {@code Z} pour UTC).
 */
@Converter
public class ZoneOffsetConverter implements AttributeConverter<ZoneOffset, String> {

    @Override
    public String convertToDatabaseColumn(ZoneOffset zoneOffset) {
        return zoneOffset == null ? null : zoneOffset.getId();
    }

    @Override
    public ZoneOffset convertToEntityAttribute(String value) {
        return value == null ? null : ZoneOffset.of(value);
    }
}
