package tahiti.numerique.time_zone.metier.timezone.controller;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.metier.audit.controller.AuditResponse;

@Getter
@Setter
@FieldNameConstants
public class TimezoneResponse {

    private Long id;

    private AuditResponse audit;

    private String label;

    private String offsetUTC;
}
