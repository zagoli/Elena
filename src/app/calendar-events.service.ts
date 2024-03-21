import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {catchError, map, Observable, throwError} from "rxjs";
// @ts-ignore
import * as ICAL from 'ical.js';

@Injectable({
	providedIn: 'root'
})
export class CalendarEventsService {

	private proxyTried = false;

	constructor(private httpClient: HttpClient) {
	}

	getCalendarFile(calendarUrl: string): Observable<any[]> {
		return this.httpClient.get(calendarUrl, {responseType: "text"})
			.pipe(
				map((ics: string) => {
					this.proxyTried = false; // if request succeeds, reset to retry later with proxy
					const jCalData = ICAL.parse(ics);
					const ICalendar = new ICAL.Component(jCalData);
					return ICalendar.getAllSubcomponents('vevent').map((e: any) => new ICAL.Event(e));
				}),
				catchError(err => {
					return this.handleError(err);
				})
			)

	}

	private handleError(error: HttpErrorResponse) {
		if (error.status === 0 && !this.proxyTried) {
			this.proxyTried = true;
			return this.getCalendarFile("https://corsproxy.io/?" + error.url);
		}
		return throwError(() => new Error('Something bad happened; please try again later.'));
	}
}
