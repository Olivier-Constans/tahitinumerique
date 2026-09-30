package tahiti.numerique.time_zone.metier.audit.controller;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class AuditResponse {

    private Instant createDate;

    private Instant updateDate;
}
