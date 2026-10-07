package tahiti.numerique.time_zone.persistence.place.zone_id;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.persistence.place.Place;

import java.time.ZoneId;

/**
 * Lieu rattaché à une zone IANA (ex : {@code Europe/Paris}) : le décalage UTC suit les changements d'heure.
 */
@Entity
@DiscriminatorValue(ZoneIdPlace.TYPE)
@NoArgsConstructor
@Getter
@Setter
@FieldNameConstants
public class ZoneIdPlace extends Place {

    public static final String TYPE = "ZONE_ID";
    public static final String ZONE_ID_COLUMN = "zone_id";
    public static final int ZONE_ID_MAX_LENGTH = 50;

    @Column(name = ZONE_ID_COLUMN, length = ZONE_ID_MAX_LENGTH)
    @Convert(converter = ZoneIdConverter.class)
    private ZoneId zoneId;

    @Override
    public String getType() {
        return TYPE;
    }

    @Override
    public ZoneId toZoneId() {
        return zoneId;
    }
}
