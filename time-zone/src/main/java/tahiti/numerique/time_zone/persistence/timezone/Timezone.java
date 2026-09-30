package tahiti.numerique.time_zone.persistence.timezone;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.persistence.OffsetUTC;
import tahiti.numerique.time_zone.persistence.audit.Audit;
import tahiti.numerique.time_zone.persistence.audit.AuditListener;
import tahiti.numerique.time_zone.persistence.audit.Auditable;

@Entity
@EntityListeners(AuditListener.class)
@NoArgsConstructor
@Getter
@Setter
@FieldNameConstants
public class Timezone implements Auditable {

    public static final int LABEL_MAX_LENGTH = 100;

    @Id
    @GeneratedValue
    private Long id;

    @Embedded
    private Audit audit;

    @Column(nullable = false, length = LABEL_MAX_LENGTH)
    private String label;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OffsetUTC offsetUTC;

}
