package tahiti.numerique.time_zone.metier.timezone.controller;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

@Getter
@Setter
@FieldNameConstants
public class TimezoneRequest {
    private String label;
    private String offsetUTC;
}
