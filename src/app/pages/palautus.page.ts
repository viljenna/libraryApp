import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Asiakas, Lainaus, SupabaseService } from '../supabase.service';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { format } from 'date-fns-tz';
import { isBefore } from 'date-fns';

@Component({
    selector:'app-palautus',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    template: `
    <div class="flex flex-col justify-center bg-lime-100 gap-4 p-12 w-4/5 justify-center mx-auto">
        <h2 class="text-xl text-lime-900">Palautus</h2>
        <form 
            class="flex flex-col gap-2" 
            [formGroup]="lainausForm" 
            (submit)="submit()">
            <input 
                id="nide" 
                formControlName="nide" 
                type="text" 
                placeholder="Niteen numero"
                class="w-1/3 self-center p-2">
            <button 
                type="submit"
                class="p-2 w-1/3 self-center bg-lime-900 text-white"
                >Palauta
            </button>
        </form>

        <p class="text-red-500">{{error}}</p>
        <ul 
            *ngFor="let p of palautukset"
            class="flex flex-col">
            <li class="bg-lime-50 p-4">
            <p class="text-lg text-lime-900">{{p.nimi}}</p>
            <p class="text-md">{{p.kirjoittaja}}</p>
            <p class="text-md">{{p.tyyppi}}, {{p.luokka}}</p>
            <p class="text-md text-lime-700">eräpäivä {{ muokkaaPv(p.erapaiva) }}, palautettu: {{muokkaaPv(p.palautuspv)}}</p>
            <p class="text-md text-red-500">{{p.myohassa}}</p>
            </li>
        </ul>
        
        <a routerLink="/">
            <button
            class="p-2 bg-lime-900 text-white"
                >Valmis
            </button>
        </a>
        
    </div>
    
    `,
    styles:[]
})

export default class PalautusComponent {

    asiakas : Asiakas | undefined;
    error : string = "";
    palautukset : Lainaus[] = []; 
    haetutLainat : Lainaus[] = [];
    today : number = Date.now();
    haettuLainaus : Lainaus | undefined;
    
   
    constructor(private api: SupabaseService, private changeDetection: ChangeDetectorRef, private router: Router) {}

    lainausForm = new FormGroup({
        nide : new FormControl('')
    })

    ngOnChanges() : void {
        this.error
        this.haetutLainat
    }


    async submit() {
        
        if (this.lainausForm.value.nide) {
            
            await this.api.haeLaina(Number(this.lainausForm.value.nide))
            .catch(error => this.error = error)
            .then(laina => this.haetutLainat = laina.laina)

            this.haetutLainat.map((l : Lainaus) => {
                if (!l.palautuspv) {
                    this.haettuLainaus = l;
                }
            })

            if (this.haettuLainaus) {

                this.error = "";
                await this.api.muokkaaPalautus(Number(this.lainausForm.value.nide))
                this.haettuLainaus.palautuspv = new Date();

                console.log(this.haettuLainaus)

                if (isBefore(new Date(this.haettuLainaus.palautuspv), new Date(this.haettuLainaus.erapaiva))) {
                    this.palautukset.push(this.haettuLainaus)
                } else {
                    this.haettuLainaus.myohassa = "Palautus myöhässä!"
                    this.palautukset.push(this.haettuLainaus)
                }
                
                console.log(this.palautukset)
                
            } else {
                this.error = "Nide on jo palautettu!"
            }
            this.changeDetection.detectChanges();
        }
    }

    muokkaaPv(pv : any) : any {
        return format(new Date(pv), "dd.MM.yyyy")
    }

}