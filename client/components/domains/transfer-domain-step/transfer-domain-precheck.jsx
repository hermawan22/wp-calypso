/** @format */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import classNames from 'classnames';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import Notice from 'components/notice';
import { recordTracksEvent } from 'state/analytics/actions';
import FormattedHeader from 'components/formatted-header';
import {
	CALYPSO_CONTACT,
	INCOMING_DOMAIN_TRANSFER_PREPARE_AUTH_CODE,
	INCOMING_DOMAIN_TRANSFER_PREPARE_UNLOCK,
} from 'lib/url/support';
import FormTextInput from 'components/forms/form-text-input';
import FormInputValidation from 'components/forms/form-input-validation';

class TransferDomainPrecheck extends React.Component {
	static propTypes = {
		authCodeValid: PropTypes.bool,
		checkAuthCode: PropTypes.func,
		domain: PropTypes.string,
		loading: PropTypes.bool,
		losingRegistrar: PropTypes.string,
		losingRegistrarIanaId: PropTypes.string,
		refreshStatus: PropTypes.func,
		selectedSiteSlug: PropTypes.string,
		setValid: PropTypes.func,
		supportsPrivacy: PropTypes.bool,
		unlocked: PropTypes.bool,
	};

	state = {
		authCode: '',
		currentStep: 1,
		unlockCheckClicked: false,
	};

	componentWillMount() {
		this.componentWillReceiveProps( this.props );
	}

	componentWillReceiveProps( nextProps ) {
		// Reset steps if domain became locked again
		if ( false === nextProps.unlocked ) {
			this.resetSteps();
		}

		if ( nextProps.unlocked && 1 === this.state.currentStep ) {
			this.showNextStep();
		}

		if ( nextProps.authCodeValid && 2 === this.state.currentStep ) {
			this.showNextStep();
		}
	}

	onClick = () => {
		const { losingRegistrar, losingRegistrarIanaId, domain, supportsPrivacy } = this.props;

		this.props.recordContinueButtonClick( domain, losingRegistrar, losingRegistrarIanaId );

		this.props.setValid( domain, this.state.authCode, supportsPrivacy );
	};

	resetSteps = () => {
		if ( this.state.currentStep !== 1 ) {
			this.setState( { currentStep: 1 } );
		}
	};

	showNextStep = () => {
		this.props.recordNextStep( this.props.domain, this.state.currentStep + 1 );
		this.setState( { currentStep: this.state.currentStep + 1 } );
	};

	statusRefreshed = () => {
		this.setState( { unlockCheckClicked: true } );
	};

	refreshStatus = () => {
		this.props.refreshStatus( this.statusRefreshed );
	};

	checkAuthCode = () => {
		this.props.checkAuthCode( this.props.domain, this.state.authCode );
	};

	getSection( heading, message, buttonText, step, stepStatus, onButtonClick ) {
		const { currentStep } = this.state;
		const { loading } = this.props;
		const isAtCurrentStep = step === currentStep;
		const isStepFinished = currentStep > step;
		const sectionClasses = classNames( 'transfer-domain-step__section', {
			'is-expanded': isAtCurrentStep,
			'is-complete': isStepFinished,
		} );

		const sectionIcon = isStepFinished ? <Gridicon icon="checkmark-circle" size={ 36 } /> : step;

		return (
			<Card compact>
				<div className={ sectionClasses }>
					<span className="transfer-domain-step__section-heading-number">{ sectionIcon }</span>
					<div className="transfer-domain-step__section-text">
						<div className="transfer-domain-step__section-heading">
							<strong>{ heading }</strong>
							{ isStepFinished && stepStatus }
						</div>
						{ isAtCurrentStep && (
							<div>
								<div className="transfer-domain-step__section-message">{ message }</div>
								<div className="transfer-domain-step__section-action">
									<Button compact onClick={ onButtonClick } busy={ loading }>
										{ buttonText }
									</Button>
									{ stepStatus }
								</div>
							</div>
						) }
					</div>
				</div>
			</Card>
		);
	}

	getStatusMessage() {
		const { loading, translate, unlocked } = this.props;
		const { currentStep, unlockCheckClicked } = this.state;
		const step = 1;
		const isStepFinished = currentStep > step;

		let heading = translate( "Can't get the domain's lock status." );
		if ( true === unlocked ) {
			heading = translate( 'Domain is unlocked.' );
		} else if ( false === unlocked ) {
			heading = translate( 'Unlock the domain.' );
		}
		if ( loading && ! isStepFinished ) {
			heading = translate( 'Checking domain lock status.' );
		}

		let message = translate(
			"{{notice}}We couldn't get the lock status of your domain from your current registrar.{{/notice}} If you're sure your " +
				"domain is unlocked then, you can continue to the next step. If it's not unlocked, then the transfer won't work. " +
				'{{a}}Here are instructions to make sure your domain is unlocked.{{/a}}',
			{
				components: {
					notice: <Notice showDismiss={ false } status="is-warning" />,
					br: <br />,
					a: (
						<a
							href={ INCOMING_DOMAIN_TRANSFER_PREPARE_UNLOCK }
							rel="noopener noreferrer"
							target="_blank"
						/>
					),
				},
			}
		);

		if ( true === unlocked ) {
			message = translate( 'Your domain is unlocked at your current registrar.' );
		} else if ( false === unlocked ) {
			message = translate(
				"Your domain is locked to prevent unauthorized transfers. You'll need to unlock " +
					'it at your current domain provider before we can move it. {{a}}Here are instructions for unlocking it{{/a}}. ' +
					'It might take a few minutes for any changes to take effect.',
				{
					components: {
						a: (
							<a
								href={ INCOMING_DOMAIN_TRANSFER_PREPARE_UNLOCK }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
					},
				}
			);
		}
		if ( loading && ! isStepFinished ) {
			message = translate( 'Please wait while we check the lock staus of your domain.' );
		}

		const buttonText = unlockCheckClicked
			? translate( 'Check again' )
			: translate( "I've unlocked my domain" );

		let lockStatusClasses = 'transfer-domain-step__lock-status transfer-domain-step__unavailable';
		if ( true === unlocked ) {
			lockStatusClasses = 'transfer-domain-step__lock-status transfer-domain-step__unlocked';
		} else if ( false === unlocked ) {
			lockStatusClasses = 'transfer-domain-step__lock-status transfer-domain-step__locked';
		}

		let lockStatusIcon = 'info';
		if ( true === unlocked ) {
			lockStatusIcon = 'checkmark';
		} else if ( false === unlocked ) {
			lockStatusIcon = 'cross';
		}

		let lockStatusText = translate( 'Status unavailable' );
		if ( true === unlocked ) {
			lockStatusText = translate( 'Unlocked' );
		} else if ( false === unlocked ) {
			lockStatusText = translate( 'Locked' );
		}

		if ( loading && ! isStepFinished ) {
			lockStatusClasses = 'transfer-domain-step__lock-status transfer-domain-step__checking';
			lockStatusIcon = 'sync';
			lockStatusText = 'Checking…';
		}

		const lockStatus = (
			<div className={ lockStatusClasses }>
				<Gridicon icon={ lockStatusIcon } size={ 12 } />
				<span>{ lockStatusText }</span>
			</div>
		);

		const onButtonClick =
			true === unlocked || null === unlocked ? this.showNextStep : this.refreshStatus;

		return this.getSection( heading, message, buttonText, step, lockStatus, onButtonClick );
	}

	getEppMessage() {
		const { authCodeValid, translate } = this.props;
		const { authCode } = this.state;

		const heading = translate( 'Get a domain authorization code.' );
		const explanation = translate(
			'A domain authorization code is a unique code linked only to your domain — kind of like a ' +
				"password for your domain. Log in to your current domain provider to get one. We'll send you an email " +
				'with a link to enter it and officially okay the transfer. We call it a domain authorization code, ' +
				'but it might be called a secret code, auth code, or EPP code. {{a}}Learn more{{/a}}.',
			{
				components: {
					a: (
						<a
							href={ INCOMING_DOMAIN_TRANSFER_PREPARE_AUTH_CODE }
							rel="noopener noreferrer"
							target="_blank"
						/>
					),
				},
			}
		);

		const authCodeInvalid = false === authCodeValid;

		const message = (
			<div>
				{ explanation }
				<FormTextInput
					value={ authCode }
					onChange={ this.setAuthCode }
					isError={ authCodeInvalid }
				/>
				{ authCodeInvalid && (
					<FormInputValidation text={ translate( 'Auth Code invalid' ) } isError />
				) }
			</div>
		);
		const buttonText = translate( 'Check my authorization code' );

		const stepStatus = true === authCodeValid && (
			<div className="transfer-domain-step__lock-status transfer-domain-step__auth-code-valid">
				<Gridicon icon="checkmark" size={ 12 } />
				<span>{ translate( 'Valid' ) } </span>
			</div>
		);

		return this.getSection( heading, message, buttonText, 2, stepStatus, this.checkAuthCode );
	}

	setAuthCode = event => {
		this.setState( { authCode: event.target.value } );
	};

	getHeader() {
		const { translate, domain } = this.props;

		return (
			<Card compact={ true } className="transfer-domain-step__title">
				<FormattedHeader
					headerText={ translate( "Let's get {{strong}}%(domain)s{{/strong}} ready to transfer.", {
						args: { domain },
						components: { strong: <strong /> },
					} ) }
					subHeaderText={ translate(
						'Log into your current domain provider to complete a few preliminary steps.'
					) }
				/>
				<img
					className="transfer-domain-step__illustration"
					src={ '/calypso/images/illustrations/migrating-host-diy.svg' }
				/>
			</Card>
		);
	}

	render() {
		const { authCodeValid, translate, unlocked } = this.props;
		const { currentStep } = this.state;

		return (
			<div className="transfer-domain-step__precheck">
				{ this.getHeader() }
				{ this.getStatusMessage() }
				{ this.getEppMessage() }
				<Card className="transfer-domain-step__continue">
					<div className="transfer-domain-step__continue-text">
						<p>
							{ translate(
								'Note: These changes can take some time to take effect. ' +
									'Need help? {{a}}Get in touch with one of our Happiness Engineers{{/a}}.',
								{
									components: {
										a: <a href={ CALYPSO_CONTACT } rel="noopener noreferrer" target="_blank" />,
									},
								}
							) }
						</p>
					</div>
					<Button
						disabled={ false === unlocked || ! authCodeValid || currentStep < 3 }
						onClick={ this.onClick }
						primary={ true }
					>
						{ translate( 'Continue' ) }
					</Button>
				</Card>
			</div>
		);
	}
}

const recordNextStep = ( domain_name, show_step ) =>
	recordTracksEvent( 'calypso_transfer_domain_precheck_step_change', { domain_name, show_step } );

const recordContinueButtonClick = ( domain_name, losing_registrar, losing_registrar_iana_id ) =>
	recordTracksEvent( 'calypso_transfer_domain_precheck_continue_click', {
		domain_name,
		losing_registrar,
		losing_registrar_iana_id,
	} );

export default connect( null, {
	recordNextStep,
	recordContinueButtonClick,
} )( localize( TransferDomainPrecheck ) );
