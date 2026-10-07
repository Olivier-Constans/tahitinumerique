package tahiti.numerique.time_zone.persistence.place.zone_id;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.ZoneId;

/**
 * Stocke une zone par son identifiant IANA (ex : {@code Pacific/Tahiti}).
 */
@Converter
public class ZoneIdConverter implements AttributeConverter<ZoneId, String> {

    @Override
    public String convertToDatabaseColumn(ZoneId zoneId) {
        return zoneId == null ? null : zoneId.getId();
    }

    @Override
    public ZoneId convertToEntityAttribute(String value) {
        return value == null ? null : ZoneId.of(value);
    }
}
