import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { Asiakas, Lainaus, Nide, SupabaseService, Teos } from '../../supabase.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule} from '@angular/common';
import { addDays, format } from 'date-fns';
import { Router} from '@angular/router';

@Component( {
    selector: 'app-omat-lainaukset',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './lainaukset.page.html',
}) 

export default class OmatLainauksetComponent {

    asiakas : Asiakas | undefined;
    error : string = "";
    lainaukset : Lainaus[] = []; 
    haettuNide : Nide | undefined;
    haettuTeos : Teos | undefined;
    today : number = Date.now();
    omatLainaukset : Lainaus[] = [];
    haettuLaina : Lainaus | undefined;
    kaikkiLainat : Lainaus[] = [];
      
    constructor(private api: SupabaseService, private changeDetection: ChangeDetectorRef, private router: Router) {}

    @Input() 
    kortinNro: string = "";

    ngOnInit() : void {
        this.haeTiedot()
        this.haeLainat()
    }

    ngOnChanges() : void {
        this.error
        this.lainaukset
        this.kaikkiLainat
        this.haettuLaina
    }

    lainausForm = new FormGroup({
        nide : new FormControl('')
    })

    async haeTiedot() {
        await this.api.etsiAsiakas(this.kortinNro)
        .catch(error => this.error = error)
        .then(asiakas => this.asiakas = asiakas.asiakas[0])
    }
    async haeLainat() {
        await this.api.getLainat(Number(this.kortinNro))
        .catch(error => this.error = error)
        .then(lainat => this.omatLainaukset = lainat.lainat)
        console.log(this.omatLainaukset)
    }

    async submit() {
        this.error = "";
        
        if (this.lainausForm.value.nide) {
            await this.api.haeNide(this.lainausForm.value.nide)
            .catch(error => this.error = error)
            .then(nide => this.haettuNide = nide.nide[0])
        }
        if (this.haettuNide) {
            await this.api.haeTeos(this.haettuNide.teos_id)
            .catch(error => this.error = error)
            .then(teos => this.haettuTeos = teos.teos[0])

            await this.api.haeLaina(Number(this.haettuNide.nide_id))
            .catch(error => this.error = error)
            .then(laina => this.kaikkiLainat = laina.laina)

            this.kaikkiLainat.map((l : Lainaus) => {
                if (!l.palautuspv) {
                    this.haettuLaina = l;
                }
            })
        }

        if (this.haettuNide && this.haettuTeos && this.asiakas ) {
            let lainaus : Lainaus = {
                teos_id:this.haettuTeos.teos_id, 
                nide_id:this.haettuNide.nide_id, 
                asiakasnro:this.asiakas.asiakasnro, 
                erapaiva:this.laskeEraPaiva(this.haettuNide.lainaaika_vrk), 
                palautuspv : null, 
                luokka: this.haettuTeos.luokka, 
                kirjoittaja:this.haettuTeos.kirjoittaja, 
                nimi: this.haettuTeos.nimike, 
                tyyppi: this.haettuNide.tyyppi
            }

            if (this.haettuLaina && this.haettuLaina.palautuspv == null) {
                this.error = "Nide lainassa";
            } else {
                this.lainaukset.push(lainaus)
                this.error = "";
            }
        }
        this.haettuLaina = undefined;
        this.kaikkiLainat = [];
        this.changeDetection.detectChanges();
    }

    laskeEraPaiva(lainaAika : number) : any {
        return addDays(this.today, lainaAika)
    }
    muokkaaPv(pv : any) : any {
        return format(new Date(pv), "dd.MM.yyyy")
    }

    lopeta(kuitti : boolean) : void {
        if (kuitti) {
            console.log(
                "Lainat " + format(this.today, "dd.MM.yyyy") + ": ", 
                JSON.stringify(this.asiakas), 
                JSON.stringify(this.lainaukset))
        }
        
        this.api.Lainaa(this.lainaukset);

        this.router.navigateByUrl("/")
    }
}