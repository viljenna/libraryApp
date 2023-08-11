import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Asiakas, Lainaus, Nide, SupabaseService, Teos } from '../../supabase.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule} from '@angular/common';
import { format, isAfter, isBefore} from 'date-fns';
import { Router, RouterLink} from '@angular/router';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
@Component( {
    selector: 'app-omat-tiedot',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: './omatTiedot.page.html'
}) 

export default class OmatTiedotComponent {

    asiakas : Asiakas | undefined;
    error : string = "";
    kaikkiLainat : Lainaus[] = []; 
    haettuNide : Nide | undefined;
    haettuTeos : Teos | undefined;
    today : number = Date.now();
    osoiteAuki : boolean = false;
    puhAuki : boolean = false;
    lainassa : Lainaus[] = [];
    myohassa : Lainaus[] = [];
    maksut : number = 0;
    
   
    constructor(private api: SupabaseService, private changeDetection: ChangeDetectorRef, private router: Router) {}

    @Input() 
    kortinNro: string = "";

    ngOnInit() : void {
        this.haeTiedot()
        this.haeLainat()
    }
    ngOnChanges() : void {
        this.error
        this.osoiteAuki
        this.puhAuki
        this.asiakas
    }

    lainausForm = new FormGroup({
        nide : new FormControl('')
    })

    osoiteForm = new FormGroup({
        katuosoite : new FormControl(''),
        postinro: new FormControl(''),
        postitmp: new FormControl(''),
        puh: new FormControl('')
    })

    async haeTiedot() {
        await this.api.etsiAsiakas(this.kortinNro)
        .catch(error => this.error = error)
        .then(asiakas => this.asiakas = asiakas.asiakas[0])

        this.changeDetection.detectChanges();
    }

    async haeLainat() {
        
        await this.api.getLainat(Number(this.kortinNro))
        .catch(error => this.error = error)
        .then(lainat => this.kaikkiLainat = lainat.lainat)

        this.kaikkiLainat.map((l:Lainaus) => {
            if (!l.palautuspv) {
                this.lainassa.push(l);
            }
        })
        this.kaikkiLainat.map((m:Lainaus) => {
            if (isAfter(new Date(m.palautuspv), new Date(m.erapaiva)) || isBefore(new Date(m.erapaiva), new Date(this.today))) {
                this.myohassa.push(m);
                this.maksut += this.laskeMaksut(m.erapaiva, m.palautuspv)
            }
        })
        
        if (this.lainassa.length == 0) {
            this.error = "Ei lainoja."
        }

        this.changeDetection.detectChanges();
    }

    muokkaaPv(pv : any) : any {
        if (pv) {
            return format(new Date(pv), "dd.MM.yyyy")
        } else {
            return "lainassa"
        }
    }
    
    onkoMyohassa(erapv : any) {
        return isBefore(new Date(erapv), this.today)
    }

    muokkaaOsoite() {
        this.osoiteAuki = true
    }

    muokkaaPuh() {
        this.puhAuki = true
    }

    laskeMaksut(erapv : any, palautettu : any) : number {
        let pv : number = 0;
        let maksut : number = 0;

        if (palautettu) {
            pv = Math.abs(differenceInCalendarDays(new Date(erapv), new Date(palautettu)));
        } else {
            pv = Math.abs(differenceInCalendarDays(new Date(erapv), new Date(this.today)));
        }
        
        maksut = pv * 0.6;

        if (maksut > 6) {
            return 6
        } else {
            return maksut
        }
    }

    async submit() {
        let katu :string | undefined | null = this.osoiteForm.value.katuosoite;
        let nro : string | undefined | null = this.osoiteForm.value.postinro;
        let tmp : string | undefined | null = this.osoiteForm.value.postitmp;
        let puh : string | undefined | null = this.osoiteForm.value.puh;

        if ( katu && nro && tmp ) {
            await this.api.muokkaaKayttaja({katuosoite : katu, postinro : nro, postitmp : tmp}, Number(this.kortinNro))
        } else if (katu && nro) {
            await this.api.muokkaaKayttaja({katuosoite : katu, postinro : nro}, Number(this.kortinNro))
        } else if (katu && tmp) {
            await this.api.muokkaaKayttaja({katuosoite : katu, postitmp : tmp}, Number(this.kortinNro))
        } else if (nro && tmp) {
            await this.api.muokkaaKayttaja({postinro : nro, postitmp : tmp}, Number(this.kortinNro))
        } else if (katu) {
            await this.api.muokkaaKayttaja({katuosoite : katu}, Number(this.kortinNro))
        } else if (nro) {
            await this.api.muokkaaKayttaja({postinro : nro}, Number(this.kortinNro))
        } else if (tmp) {
            await this.api.muokkaaKayttaja({postitmp : tmp}, Number(this.kortinNro))
        } else if (puh) {
            await this.api.muokkaaKayttaja({puh : puh}, Number(this.kortinNro))
        }
        
        this.haeTiedot()
        this.osoiteAuki = false
        this.puhAuki = false
        this.osoiteForm.reset();
        this.changeDetection.detectChanges();
    }

}