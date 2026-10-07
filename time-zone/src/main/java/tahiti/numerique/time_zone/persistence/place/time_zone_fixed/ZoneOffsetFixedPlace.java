package tahiti.numerique.time_zone.persistence.place.time_zone_fixed;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.persistence.place.Place;

import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Lieu dont le décalage UTC est fixe, sans changement d'heure.
 */
@Entity
@DiscriminatorValue(ZoneOffsetFixedPlace.TYPE)
@NoArgsConstructor
@Getter
@Setter
@FieldNameConstants
public class ZoneOffsetFixedPlace extends Place {

    public static final String TYPE = "ZONE_OFFSET_FIXED";
    public static final String ZONE_OFFSET_COLUMN = "zone_offset";
    public static final int ZONE_OFFSET_MAX_LENGTH = 10;

    @Column(name = ZONE_OFFSET_COLUMN, length = ZONE_OFFSET_MAX_LENGTH)
    @Convert(converter = ZoneOffsetConverter.class)
    private ZoneOffset zoneOffset;

    @Override
    public String getType() {
        return TYPE;
    }

    @Override
    public ZoneId toZoneId() {
        return zoneOffset;
    }
}
